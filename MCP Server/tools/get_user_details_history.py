def get_user_details_history(governance_id: str, section: str = 'none', sub_section: str = 'none') -> dict:
    """
    Retrieve comprehensive governance details including chat history, report, risk, cost, and environment data.
    
    Args:
        governance_id: The governance ID to retrieve details for (e.g., "GOV0006")
        section: Section filter - one of: governance_report, risk_details, commitee_approval, cost_details, environment_details, or none
        sub_section: Sub-section filter - one of: committee_1 (Primary Approval Committee), committee_2 (Secondary Approval Committee), committee_3 (Executive Approval Committee), or none
    
    Returns:
        Dictionary containing all governance-related data aggregated from multiple API endpoints.
    """
    from pydantic import BaseModel, Field
    from typing import Literal
    from utilities.api_helpers import broadcast_governance_data

    # Pydantic models for validation
    class SectionValidator(BaseModel):
        section: Literal['governance_report', 'risk_details', 'commitee_approval', 'cost_details', 'environment_details', 'none'] = Field(
            default='none',
            description="Section to filter governance details"
        )
    
    class SubSectionValidator(BaseModel):
        sub_section: Literal['committee_1', 'committee_2', 'committee_3', 'none'] = Field(
            default='none',
            description="Sub-section to filter governance details (committee approvals)"
        )
    
    # Validate section parameter
    try:
        validated = SectionValidator(section=section)
        validated_section = validated.section
    except Exception as validation_error:
        return {
            "error": f"Invalid section parameter. Must be one of: governance_report, risk_details, committee_clarifications, cost_details, environment_details, or none. Error: {str(validation_error)}",
            "governance_id": governance_id
        }
    
    # Validate sub_section parameter
    try:
        validated_sub = SubSectionValidator(sub_section=sub_section)
        validated_sub_section = validated_sub.sub_section
    except Exception as validation_error:
        return {
            "error": f"Invalid sub_section parameter. Must be one of: committee_1, committee_2, committee_3, or none. Error: {str(validation_error)}",
            "governance_id": governance_id
        }

    def clean_response_data(data: dict) -> dict:
        """Clean response data by removing unnecessary metadata and keeping only essential information"""
        cleaned = {
            "governance_id": data.get("governance_id"),
            "section": data.get("section"),
            "sub_section": data.get("sub_section")
        }
        
        # Clean governance_report - keep only report_content and documents
        if data.get("governance_report", {}).get("data") and len(data["governance_report"]["data"]) > 0:
            report = data["governance_report"]["data"][0]
            cleaned["governance_report"] = {
                "report_content": report.get("report_content"),
                "documents": report.get("documents", [])
            }
        
        # Clean risk_details - keep only essential risk info
        if data.get("risk_details", {}).get("data") and len(data["risk_details"]["data"]) > 0:
            risk = data["risk_details"]["data"][0]
            cleaned["risk_details"] = {
                "risk_level": risk.get("risk_level"),
                "reason": risk.get("reason"),
                "committee_1": risk.get("committee_1"),
                "committee_2": risk.get("committee_2"),
                "committee_3": risk.get("committee_3")
            }
        
        # Clean cost_details - keep only cost_breakdown and total
        if data.get("cost_details", {}).get("data") and len(data["cost_details"]["data"]) > 0:
            cost = data["cost_details"]["data"][0]
            cleaned["cost_details"] = {
                "total_estimated_cost": cost.get("total_estimated_cost"),
                "cost_breakdown": cost.get("cost_breakdown", [])
            }
        
        # Clean environment_details - keep only environment info
        if data.get("environment_details", {}).get("data") and len(data["environment_details"]["data"]) > 0:
            env = data["environment_details"]["data"][0]
            cleaned["environment_details"] = {
                "environment": env.get("environment"),
                "region": env.get("region"),
                "environment_breakdown": env.get("environment_breakdown", [])
            }
        
        # Clean cost_clarifications - keep only clarifications array
        if data.get("cost_clarifications", {}).get("data", {}).get("clarifications"):
            cleaned["cost_clarifications"] = data["cost_clarifications"]["data"]["clarifications"]
        
        # Clean environment_clarifications - keep only clarifications array
        if data.get("environment_clarifications", {}).get("data", {}).get("clarifications"):
            cleaned["environment_clarifications"] = data["environment_clarifications"]["data"]["clarifications"]
        
        # Clean committee_clarifications - keep only clarifications object with nested committees
        if data.get("committee_clarifications", {}).get("data", {}).get("clarifications"):
            cleaned["committee_clarifications"] = data["committee_clarifications"]["data"]["clarifications"]
        
        return cleaned

    try:
        # Fetch and broadcast governance data using helper function (full data with metadata)
        response_data = broadcast_governance_data(governance_id, validated_section, validated_sub_section)
        
        # Clean the response data for tool return (remove metadata, keep only essential info)
        cleaned_data = clean_response_data(response_data)
        
        return cleaned_data
    
    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "governance_id": governance_id
        }
